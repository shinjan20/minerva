"use client";

import { useState, useEffect } from "react";
import LoadingPopup from "@/components/LoadingPopup";

import toast from "react-hot-toast";

type Course = {
  id: string;
  name: string;
  batch: string;
  year: string;
  is_active: boolean;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [batch, setBatch] = useState("2025-27");
  const [year, setYear] = useState("1");
  const [credits, setCredits] = useState("1.0");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authRes.ok) setRole(authData.user.role);

      const res = await fetch("/api/courses");
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses);
      }
    } catch (err) {
      toast.error("Failed to load courses");
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
        body: JSON.stringify({ name, batch, year, credits: parseFloat(credits) }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Course created successfully");
        setName("");
        fetchCourses();
      } else {
        toast.error(data.error || "Creation failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingPopup message="Synchronizing global course databases..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
        <p className="mt-1 text-sm text-gray-500">Create courses for specific sections and configure score breakups.</p>
      </div>

      {role === "OFFICE_STAFF" && (
        <div className="bg-white p-6 shadow rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input
                type="text" required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-primary focus:border-primary"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marketing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <input
                type="text" required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-primary focus:border-primary"
                value={batch} onChange={(e) => setBatch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-primary focus:border-primary bg-white"
                value={year} onChange={(e) => setYear(e.target.value)}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-primary focus:border-primary bg-white"
                value={credits} onChange={(e) => setCredits(e.target.value)}
              >
                <option value="1.0">Full Credit (1.0)</option>
                <option value="0.5">Half Credit (0.5)</option>
              </select>
            </div>
            <button
              type="submit" disabled={creating}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-70"
            >
              {creating ? "Creating..." : "Enroll"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section / Batch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Batch: {course.batch} | Yr: {course.year}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {course.is_active ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {role === "OFFICE_STAFF" ? (
                      <a href={`/dashboard/courses/${course.id}/breakup`} className="text-primary hover:text-primary/80">Configure Breakup</a>
                  ) : (
                      <a href={`/dashboard/marks/${course.id}`} className="text-primary hover:text-primary/80">View Points Table</a>
                  )}
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No courses created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
