"use client";

import { useState, useEffect } from "react";
import LoadingPopup from "@/components/LoadingPopup";

import toast from "react-hot-toast";
import * as xlsx from "xlsx";

type AuditEntry = {
  id: string;
  action_type: string;
  course_id: string | null;
  component: string | null;
  rows_processed: number | null;
  upload_type: string | null;
  outcome: string;
  created_at: string;
  users: { name: string; role: string; email: string } | null;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/audit/all`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(
      logs.map(log => ({
        "Timestamp": new Date(log.created_at).toLocaleString(),
        "Action Type": log.action_type,
        "User": log.users?.name || "System",
        "Role": log.users?.role || "-",
        "Email": log.users?.email || "-",
        "Component": log.component || "N/A",
        "Upload Type": log.upload_type || "N/A",
        "Rows": log.rows_processed || 0,
        "Outcome": log.outcome
      }))
    );
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Audit Log");
    xlsx.writeFile(wb, "System_Audit_Log.xlsx");
  };

  if (loading) return <LoadingPopup message="Retrieving institutional audit matrix..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
          <p className="mt-1 text-sm text-gray-500">Immutable record of all system modifications, uploads, and approval actions.</p>
        </div>
        <button 
          onClick={exportExcel}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Export to Excel
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={log.created_at}>
                    {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.users?.name || "System"}</div>
                    <div className="text-xs text-gray-500">{log.users?.role || "SYSTEM_EVENT"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 bg-gray-50/50">
                    {log.action_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.component && <span>Comp: {log.component} </span>}
                    {log.upload_type && <span>({log.upload_type}) </span>}
                    {log.rows_processed && <span>Rows: {log.rows_processed}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.outcome === "SUCCESS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {log.outcome}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No audit records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
