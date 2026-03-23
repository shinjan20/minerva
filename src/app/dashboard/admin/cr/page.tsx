"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import LoadingPopup from "@/components/LoadingPopup";


type CRUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  section: string;
  batch: string;
  created_at: string;
};

export default function ManageCRsPage() {
  const [crs, setCrs] = useState<CRUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCRs();
  }, []);

  const fetchCRs = async () => {
    try {
      const res = await fetch("/api/admin/cr");
      const data = await res.json();
      if (res.ok) {
        setCrs(data.crs);
      }
    } catch (err) {
      toast.error("Failed to load CRs");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "revoke") => {
    try {
      const res = await fetch(`/api/admin/cr/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: "Manual rejection" } : {}),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`CR ${action}d successfully`);
        fetchCRs();
      } else {
        toast.error(data.error || `Failed to ${action}`);
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  if (loading) return <LoadingPopup message="Retrieving delegated authorization roles..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Class Representatives</h1>
        <p className="mt-1 text-sm text-gray-500">Approve pending applications or revoke active access.</p>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section & Batch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {crs.map((cr) => (
              <tr key={cr.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{cr.name}</div>
                  <div className="text-sm text-gray-500">{cr.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Sec: {cr.section}</div>
                  <div className="text-sm text-gray-500">Batch: {cr.batch}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${cr.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      cr.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : 
                      "bg-red-100 text-red-800"}`}>
                    {cr.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {cr.status === "PENDING" && (
                    <>
                      <button onClick={() => handleAction(cr.id, "approve")} className="text-green-600 hover:text-green-900">Approve</button>
                      <button onClick={() => handleAction(cr.id, "reject")} className="text-red-600 hover:text-red-900">Reject</button>
                    </>
                  )}
                  {cr.status === "ACTIVE" && (
                    <button onClick={() => handleAction(cr.id, "revoke")} className="text-red-600 hover:text-red-900">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
            {crs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No CR records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
