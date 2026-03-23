"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingPopup from "@/components/LoadingPopup";


type Breakup = {
  quiz_attempts: number;
  quiz_aggregation: "BEST_N" | "AVERAGE" | "SUM";
  quiz_best_n: number | null;
  quiz_pct: number;
  midterm_pct: number;
  project_pct: number;
  endterm_pct: number;
  is_locked: boolean;
};

export default function ScoreBreakupPage() {
  const { id } = useParams();
  const router = useRouter();

  const [breakup, setBreakup] = useState<Breakup>({
    quiz_attempts: 1,
    quiz_aggregation: "SUM",
    quiz_best_n: null,
    quiz_pct: 0,
    midterm_pct: 0,
    project_pct: 0,
    endterm_pct: 0,
    is_locked: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBreakup();
  }, []);

  const fetchBreakup = async () => {
    try {
      const res = await fetch(`/api/courses/${id}/breakup`);
      const data = await res.json();
      if (res.ok && data.breakup) {
        setBreakup(data.breakup);
      }
    } catch (err) {
      toast.error("Failed to load breakup config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sum = Number(breakup.quiz_pct) + Number(breakup.midterm_pct) + Number(breakup.project_pct) + Number(breakup.endterm_pct);
    if (sum !== 100) {
      toast.error(`Weights must sum precisely to 100. Current sum: ${sum}`);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/courses/${id}/breakup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(breakup),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Score breakup saved successfully");
        fetchBreakup();
      } else {
        toast.error(data.error || "Failed to save breakup");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPopup message="Retrieving configuration and grading thresholds..." />;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configure Score Breakup</h1>
          <p className="mt-1 text-sm text-gray-500">All weights must sum exactly to 100%. Configuration is locked after first marks upload.</p>
        </div>
        <button onClick={() => router.back()} className="text-sm font-medium text-primary hover:underline">
          &larr; Back to Courses
        </button>
      </div>

      {breakup.is_locked && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            <strong>Breakup Locked:</strong> This breakup is locked because marks have already been uploaded for this course.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white shadow rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Component Weights (%)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz / Assignments</label>
              <input type="number" step="0.01" min="0" max="100" required disabled={breakup.is_locked}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100"
                value={breakup.quiz_pct} onChange={(e) => setBreakup({...breakup, quiz_pct: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Midterm</label>
              <input type="number" step="0.01" min="0" max="100" required disabled={breakup.is_locked}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100"
                value={breakup.midterm_pct} onChange={(e) => setBreakup({...breakup, midterm_pct: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <input type="number" step="0.01" min="0" max="100" required disabled={breakup.is_locked}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100"
                value={breakup.project_pct} onChange={(e) => setBreakup({...breakup, project_pct: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Term</label>
              <input type="number" step="0.01" min="0" max="100" required disabled={breakup.is_locked}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100"
                value={breakup.endterm_pct} onChange={(e) => setBreakup({...breakup, endterm_pct: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            <div className={`p-4 rounded-md font-bold flex justify-between ${
              (Number(breakup.quiz_pct) + Number(breakup.midterm_pct) + Number(breakup.project_pct) + Number(breakup.endterm_pct)) === 100 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <span>Total Weight:</span>
              <span>{(Number(breakup.quiz_pct) + Number(breakup.midterm_pct) + Number(breakup.project_pct) + Number(breakup.endterm_pct)).toFixed(2)}%</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Quiz Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Quiz Attempts</label>
              <input type="number" min="1" max="10" required disabled={breakup.is_locked}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100"
                value={breakup.quiz_attempts} onChange={(e) => setBreakup({...breakup, quiz_attempts: parseInt(e.target.value) || 1})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Aggregation Rule</label>
              <select required disabled={breakup.is_locked}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100"
                value={breakup.quiz_aggregation} onChange={(e) => setBreakup({...breakup, quiz_aggregation: e.target.value as any})}
              >
                <option value="SUM">Sum of All</option>
                <option value="AVERAGE">Average of All</option>
                <option value="BEST_N">Best of N</option>
              </select>
            </div>

            {breakup.quiz_aggregation === "BEST_N" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value of N (Best N)</label>
                <input type="number" min="1" max={breakup.quiz_attempts} required disabled={breakup.is_locked}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100"
                  value={breakup.quiz_best_n || ""} onChange={(e) => setBreakup({...breakup, quiz_best_n: parseInt(e.target.value) || 1})}
                />
              </div>
            )}
          </div>
        </div>

        {!breakup.is_locked && (
          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit" disabled={saving}
              className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-70"
            >
              {saving ? "Saving Configuration..." : "Save Configuration"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
