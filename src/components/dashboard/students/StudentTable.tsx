"use client";

import { useState, useMemo } from "react";
import * as xlsx from "xlsx";
import { TableSkeleton } from "@/components/Skeleton";

interface StudentTableProps {
  rosterData: any[];
  rosterLoading: boolean;
  onResendInvite: (email: string, name: string) => void;
  onRemoveStudent: (id: string, name: string) => void;
}

export default function StudentTable({
  rosterData,
  rosterLoading,
  onResendInvite,
  onRemoveStudent
}: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState<string>("ALL");
  const [filterBatch, setFilterBatch] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const filteredRoster = useMemo(() => {
    return rosterData.filter(student => {
      const matchesSearch = !searchTerm || 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSection = filterSection === "ALL" || student.section === filterSection;
      const matchesBatch = filterBatch === "ALL" || student.batch === filterBatch;

      return matchesSearch && matchesSection && matchesBatch;
    });
  }, [rosterData, searchTerm, filterSection, filterBatch]);

  const totalPages = Math.ceil(filteredRoster.length / itemsPerPage);
  const paginatedRoster = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRoster.slice(start, start + itemsPerPage);
  }, [filteredRoster, currentPage]);

  const handleDownloadTemplate = () => {
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
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-2xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-fade-in-up mt-8 md:mt-16">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30"></div>
      <div className="p-6 md:p-10 border-b border-white/[0.06] flex flex-col xl:flex-row xl:items-center justify-between gap-6 md:gap-8">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
             <span className="w-1.5 md:w-2 h-5 md:h-6 bg-blue-600 rounded-full" />
             Registered Students
          </h3>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 md:mt-2 pl-4 md:pl-5">
            <span className="text-blue-400">{filteredRoster.length}</span> students matches your filters
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
            <select 
              value={filterBatch}
              onChange={(e) => { setFilterBatch(e.target.value); setCurrentPage(1); }}
              className="appearance-none px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer hover:bg-white/[0.05]"
            >
              <option value="ALL">All Batches</option>
              {Array.from(new Set(rosterData.map(s => s.batch).filter(Boolean))).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select 
              value={filterSection}
              onChange={(e) => { setFilterSection(e.target.value); setCurrentPage(1); }}
              className="appearance-none px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer hover:bg-white/[0.05]"
            >
              <option value="ALL">All Sections</option>
              {sectionOptions.map(s => (
                <option key={s} value={s}>SEC {s}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Search students..."
            className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          
          <button 
            onClick={handleDownloadTemplate}
            className="px-6 py-2.5 bg-white text-blue-600 border border-white/[0.08] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Template
          </button>
        </div>
      </div>
      
      {rosterLoading ? (
        <div className="p-10">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : paginatedRoster.length === 0 ? (
        <div className="p-24 text-center">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">No Students Found</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto mt-3 italic leading-loose">
            No students match your current search or filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                  <th className="px-4 md:px-8 py-5 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student ID</th>
                  <th className="px-4 md:px-8 py-5 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Full Name</th>
                  <th className="hidden lg:table-cell px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Email Address</th>
                  <th className="px-4 md:px-8 py-5 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Section</th>
                  <th className="hidden sm:table-cell px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-4 md:px-8 py-5 text-right text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {paginatedRoster.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap text-[11px] md:text-[12px] font-black font-mono text-blue-400 tracking-tight">{student.student_id}</td>
                    <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap text-xs md:text-sm text-slate-900 dark:text-white font-bold uppercase">{student.name}</td>
                    <td className="hidden lg:table-cell px-8 py-5 whitespace-nowrap text-[12px] font-medium text-slate-400 font-mono opacity-80">{student.email}</td>
                    <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                      <span className="px-2 md:px-3 py-1 inline-flex text-[9px] md:text-[10px] font-black rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                        {student.section}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-8 py-5 whitespace-nowrap">
                      {student.status === "ACTIVE" ? (
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          Registered
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 md:gap-3">
                        {student.status === "PENDING" && (
                          <button
                            onClick={() => onResendInvite(student.email, student.name)}
                            className="py-1.5 md:py-2 px-3 md:px-4 rounded-lg md:rounded-xl bg-blue-500/10 text-blue-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap"
                          >
                            Invite
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveStudent(student.id, student.name)}
                          className="py-1.5 md:py-2 px-3 md:px-4 rounded-lg md:rounded-xl bg-red-500/10 text-red-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-8 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/[0.08] disabled:opacity-30 transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/[0.08] disabled:opacity-30 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
