"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as xlsx from "xlsx";

export default function StudentRosterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rosterData, setRosterData] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoster = rosterData.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.section?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      toast.error("Failed to read Excel file constraints.");
      setFile(null);
      setPreviewData(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setPreviewData(null);
      return;
    }
    setFile(selectedFile);
    processFileForPreview(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    if (!droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error("Please drop a valid Excel file (.xlsx or .xls)");
      return;
    }
    
    setFile(droppedFile);
    processFileForPreview(droppedFile);
  };

  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Helper for highlighting existing students in preview
  const getStudentId = (row: any) => {
    if (!row) return null;
    const norm: Record<string, any> = {};
    Object.keys(row).forEach(k => {
      norm[k.trim().toLowerCase().replace(/\s+/g, '')] = row[k];
    });
    return (norm["studentid"] || norm["id"])?.toString();
  };

  const getIsCR = (row: any) => {
    if (!row) return false;
    const norm: Record<string, any> = {};
    Object.keys(row).forEach(k => {
      norm[k.trim().toLowerCase().replace(/\s+/g, '')] = row[k];
    });
    return String(norm["iscr"] || norm["is_cr"] || norm["role"]).toUpperCase() === "TRUE" || String(norm["role"]).toUpperCase() === "CR" || String(norm["cr"]).toUpperCase() === "Y";
  };

  const handleNextStep1 = () => {
    if (!selectedSection) {
      toast.error("Please select a section to proceed.");
      return;
    }
    setStep(2);
  };

  const handleUpload = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an Excel file first.");
      return;
    }

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
        setStep(1); // Reset to Section Selection
        setSelectedSection("");
        loadRoster(); // Reload live table
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Roster Management</h1>
        <p className="mt-2 text-md text-gray-500">Upload bulk student data seamlessly through our guided wizard.</p>
      </div>

      <div className="bg-white p-8 shadow-sm rounded-xl border border-gray-100 relative overflow-hidden">
        <div className="mb-10">
          <div className="flex items-center justify-center max-w-lg mx-auto relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
              <span className={`text-xs mt-2 font-medium ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>Section</span>
            </div>
            <div className={`w-32 h-1 mx-4 rounded transition-colors duration-300 ${step >= 2 ? 'bg-primary' : 'bg-gray-100'}`}></div>
            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
              <span className={`text-xs mt-2 font-medium ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>Upload</span>
            </div>
          </div>
        </div>

        {/* Dynamic Forms based on step */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in max-w-xl mx-auto w-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">Select Section</h2>
                <p className="text-sm text-gray-500">Which section's roster are you uploading right now?</p>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 py-4">
                {sectionOptions.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setSelectedSection(letter)}
                    className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-xl font-bold transition-all border-2
                      ${selectedSection === letter 
                        ? 'bg-primary border-primary text-white shadow-lg scale-110' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleNextStep1}
                  disabled={!selectedSection}
                  className="w-full sm:w-2/3 py-3 px-4 rounded-lg shadow-md text-white font-medium bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:scale-100 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Continue to Upload
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">Upload Data for Section {selectedSection}</h2>
                <p className="text-sm text-gray-500">Provide an Excel file containing the student records.</p>
              </div>

              <div 
                className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 hover:border-primary transition-all group overflow-hidden bg-white/50 backdrop-blur-sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Click or drag Excel file to upload</p>
                    <p className="text-xs text-gray-400 mt-1">Automatically generates a preview popup</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3 px-4 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Centered Modal Popup for Preview */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Data Preview</h3>
                <p className="text-xs text-gray-500 mt-1">Review your import before confirming. File: <span className="font-semibold text-primary">{file?.name}</span></p>
              </div>
              <button 
                onClick={() => { setPreviewData(null); setFile(null); }} 
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              <div className="space-y-4">
                {(() => {
                  const existingCount = previewData.filter(row => {
                    const id = getStudentId(row);
                    return rosterData.some(r => r.student_id === id);
                  }).length;

                  // Find how many CRs are marked in this sheet
                  const crRows = previewData.filter(row => getIsCR(row));
                  const crCount = crRows.length;
                  const crCollision = crCount > 1;

                  return (
                    <div className="space-y-3">
                      {existingCount > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg shadow-sm">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-amber-800">
                                Warning: {existingCount} students in this file are already enrolled.
                              </p>
                              <p className="text-xs text-amber-700 mt-1">
                                They will be skipped to prevent duplicate records.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {crCollision && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-red-800">
                                Critical Rule Violation: Multiple CRs detected!
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                {crCount} rows are marked as 'CR'. A section can strictly only have a single Class Representative. The conflicting CR definitions will be explicitly rejected by the database to protect data integrity, while valid students will proceed.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(previewData[0] || {}).slice(0, 7).map((key, i) => (
                            <th key={key + i} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {previewData.slice(0, 10).map((row, idx) => {
                          const sId = getStudentId(row);
                          const isExisting = rosterData.some(r => r.student_id === sId);
                          const isCrRow = getIsCR(row);
                          const highlightClass = isCrRow ? 'bg-purple-50 hover:bg-purple-100/50' : (isExisting ? 'bg-amber-50/40' : 'hover:bg-gray-50/50');
                          
                          return (
                            <tr key={idx} className={`transition-colors ${highlightClass}`}>
                              {Object.keys(previewData[0] || {}).slice(0, 7).map((key, i) => {
                                const isIdCol = key.trim().toLowerCase().replace(/\s+/g, '') === 'studentid' || key.trim().toLowerCase().replace(/\s+/g, '') === 'id';
                                const isRoleCol = key.trim().toLowerCase().includes('cr') || key.trim().toLowerCase().includes('role');
                                return (
                                  <td key={key + i} className="px-5 py-3 text-sm text-gray-700 truncate max-w-[200px] relative">
                                    {String(row[key] || "")}
                                    {isExisting && isIdCol && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        Exists
                                      </span>
                                    )}
                                    {isCrRow && isRoleCol && (
                                       <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm animate-pulse">
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
                    <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500 font-medium text-center border-t border-gray-100">
                      + {previewData.length - 10} more records in file
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => { setPreviewData(null); setFile(null); }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center min-w-[160px]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Uploading...
                  </>
                ) : (
                  "Confirm & Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden animate-fade-in-up delay-100">
        <div className="px-8 py-6 border-b border-gray-100 sm:flex sm:justify-between sm:items-center space-y-4 sm:space-y-0 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Current Roster</h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-semibold text-primary">{rosterData?.length || 0}</span> Active Students Enrolled
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search students..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64 transition-all shadow-sm bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => {
                const wsTemplate = xlsx.utils.json_to_sheet([{ 
                  "Name": "John Doe", 
                  "Student ID": "PGP01001", 
                  "Mail ID": "pgp01001@iiml.ac.in", 
                  "Section": "A",
                  "Batch": "2025-27",
                  "Course Enrolled For": "PGP",
                  "Is CR": "No"
                }]);
                
                const wsInstructions = xlsx.utils.json_to_sheet([
                  { "Column Name": "Name", "Required": "Yes", "Description": "The full legal name of the student." },
                  { "Column Name": "Student ID", "Required": "Yes", "Description": "The unique institutional roll number or ID (e.g., PGP01001). The system also automatically accepts 'ID' as a header." },
                  { "Column Name": "Mail ID", "Required": "Yes", "Description": "The official college email address. The system also automatically accepts 'Email' or 'Mail' as headers." },
                  { "Column Name": "Section", "Required": "Optional", "Description": "The section designation (e.g., A, B, C). Note: The wizard step 1 selection will automatically override this column." },
                  { "Column Name": "Batch", "Required": "Optional", "Description": "The academic batch year span (e.g., 2025-27)." },
                  { "Column Name": "Course Enrolled For", "Required": "Optional", "Description": "The program or course name (e.g., PGP). The system also accepts 'Course' or 'Year' as headers." },
                  { "Column Name": "Is CR", "Required": "Optional", "Description": "Designate the Class Representative. Type 'True', 'Yes', or 'CR' to assign this student. (Strict: Maximum 1 CR per Section)." }
                ]);

                wsTemplate['!cols'] = [ { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 10 } ];
                wsInstructions['!cols'] = [ { wch: 20 }, { wch: 10 }, { wch: 100 } ];

                const wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, wsTemplate, "Data Template");
                xlsx.utils.book_append_sheet(wb, wsInstructions, "Instructions");
                xlsx.writeFile(wb, "Minerva_Roster_Template.xlsx");
              }}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-2 hover:border-gray-300"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Template
            </button>
          </div>
        </div>
        
        {rosterLoading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm font-medium">Loading roster data...</p>
          </div>
        ) : !rosterData || rosterData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              You haven't uploaded any student data for this batch yet. Use the wizard above to bulk upload an Excel file.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRoster.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                        Section {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm border-l border-transparent text-gray-500">{student.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleRemoveStudent(student.id, student.name)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRoster.length === 0 && searchTerm && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No students match your search: <span className="font-semibold text-gray-700">"{searchTerm}"</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
