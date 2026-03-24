import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    // 0. Fetch Core Student Profile
    const { data: profile } = await supabase
      .from("users")
      .select("name, student_id:email, section, batch, year:year") // year is enrolled course in users table sometimes. Let's fetch from student_roster.
      .eq("id", session.id)
      .single();

    const { data: rosterProfile } = await supabase
      .from("student_roster")
      .select("student_id, section, batch, year, name")
      .eq("user_id", session.id)
      .single();

    const identity = rosterProfile || profile;
    const studentSection = identity?.section;

    // 2. Fetch all raw marks for this student
    const rawId = identity?.student_id || "";
    const pgpid = rawId.includes('@') ? rawId.split('@')[0].toUpperCase() : rawId.toUpperCase();
    const { data: rawMarks } = await supabase
      .from("marks")
      .select("*, courses(name, term, credits)")
      .eq("pgpid", pgpid);

    if (!rawMarks || rawMarks.length === 0) {
      return NextResponse.json({ scorecards: [] });
    }

    // 3. Fetch Visibility Configs
    const { data: visibilityRules } = await supabase
      .from("marks_visibility")
      .select("*")
      .eq("is_visible", true);

    // 4. Fetch Score Breakups
    const { data: breakups } = await supabase
      .from("score_breakup")
      .select("*");

    const courseIds = rawMarks.map(m => m.course_id);
    const { data: allCourseMarks } = await supabase
      .from("marks")
      .select("course_id, marks_data")
      .in("course_id", courseIds);

    const distributions: Record<string, any[]> = {};
    const cohortData: Record<string, any> = {};

    courseIds.forEach(rmCid => {
        const marksForCourse = allCourseMarks?.filter(am => am.course_id === rmCid) || [];
        const totals = marksForCourse.map(m => m.marks_data?.Total || m.marks_data?._total || 0).filter(v => typeof v === 'number');
        
        // Theoretical Normal Distribution (Bell Curve)
        const sortedTotals = [...totals].sort((a, b) => a - b);
        const count = sortedTotals.length;
        if (count > 0) {
            const mean = sortedTotals.reduce((a, b) => a + b, 0) / count;
            const variance = sortedTotals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
            const stdDev = Math.sqrt(variance) || 1; // Avoid division by zero

            // Generate 21 points for a smooth curve (0, 5, 10, ..., 100 percentile)
            const curvePoints = Array(21).fill(0).map((_, i) => {
                const p = i * 5; // Percentile
                // For a normal distribution, we map the percentile to a Z-score
                // However, the user wants a "bell curve" look on a 0-100 scale.
                // We'll generate the density based on a standardized normal distribution centered at 50
                const z = (p - 50) / 15;
                const density = Math.exp(-0.5 * Math.pow(z, 2)) / Math.sqrt(2 * Math.PI);
                
                // Find the average marks around this percentile range for the ticker
                const index = Math.floor((p / 100) * count);
                const localAvg = sortedTotals[Math.min(index, count - 1)];

                return {
                    bin: p,
                    label: `${p}th`,
                    count: Math.round(density * count),
                    avg: localAvg,
                    density: density * 100 // Scale up for visibility (0-40 range)
                };
            });
            distributions[rmCid] = curvePoints;
        } else {
            distributions[rmCid] = [];
        }

        // Cohort Averages for Heatmap
        const componentStats: Record<string, { sum: number, count: number }> = {};
        marksForCourse.forEach(mfc => {
            const md = mfc.marks_data || {};
            Object.keys(md).forEach(k => {
              if (k.startsWith("_") || k === "Total") return;
              const val = typeof md[k] === 'object' ? md[k].score : md[k];
              if (typeof val === 'number') {
                if (!componentStats[k]) componentStats[k] = { sum: 0, count: 0 };
                componentStats[k].sum += val;
                componentStats[k].count += 1;
              }
            });
        });

        cohortData[rmCid] = {};
        Object.keys(componentStats).forEach(k => {
            cohortData[rmCid][k] = componentStats[k].sum / componentStats[k].count;
        });
    });

    // 5. Fetch Historical Snapshots for Trends
    const { data: snapshots } = await supabase
      .from("marks_snapshot")
      .select("*, courses(name, term)")
      .eq("student_id", session.id)
      .order('snapshot_at', { ascending: true });

    // 1. Fetch Student's Snapshot performance joined with Course details
    // 4. Build final UI array mapping by unifying marks + stats
    // Note: We no longer need marks_snapshot as we store everything in marks_data
    const scorecards = rawMarks.map(m => {
      const marksData = m.marks_data || {};
      const courseId = m.course_id;
      const courseObj = m.courses;
      const courseBreakup = breakups?.find(b => b.course_id === courseId);
      
      const componentKeys = Object.keys(marksData).filter(k => !k.startsWith("_"));
      
      // Calculate category counts for equal distribution
      const counts = {
        quiz: componentKeys.filter(k => k.toLowerCase().includes("quiz")).length,
        midterm: componentKeys.filter(k => k.toLowerCase().includes("mid")).length,
        project: componentKeys.filter(k => k.toLowerCase().includes("project") || k.toLowerCase().includes("viva")).length,
        endterm: componentKeys.filter(k => k.toLowerCase().includes("end")).length,
        cp: componentKeys.filter(k => k.toLowerCase().includes("participation") || k.toLowerCase() === "cp").length
      };

      const components = componentKeys.map(k => {
          const comp = marksData[k];
          // Determine weight from breakup config if available
          let weight = 0;
          const kLower = k.toLowerCase();
          
          if (kLower.includes("quiz")) {
              weight = (courseBreakup?.quiz_pct || 0) / (counts.quiz || 1);
          } else if (kLower.includes("mid")) {
              weight = (courseBreakup?.midterm_pct || 0) / (counts.midterm || 1);
          } else if (kLower.includes("project") || kLower.includes("viva")) {
              weight = (courseBreakup?.project_pct || 0) / (counts.project || 1);
          } else if (kLower.includes("end")) {
              weight = (courseBreakup?.endterm_pct || 0) / (counts.endterm || 1);
          } else if (kLower.includes("participation") || kLower === "cp") {
              weight = (courseBreakup?.cp_pct || 0) / (counts.cp || 1);
          }

          return {
              name: k,
              score: typeof comp === 'object' ? comp.score : comp,
              max: typeof comp === 'object' ? comp.max_score : 100,
              weight: parseFloat(weight.toFixed(2)),
              cohortAvg: cohortData[courseId]?.[k] || null,
              status: typeof comp === 'object' ? comp.status : 'SCORED',
              is_visible: true
          };
      });
      
      // Sort to put 'Total' at the top
      components.sort((a, b) => {
          if (a.name.toLowerCase() === 'total') return -1;
          if (b.name.toLowerCase() === 'total') return 1;
          return 0;
      });
      
      return {
        courseId: courseId,
        courseName: courseObj?.name || "Unknown",
        term: courseObj?.term || 1,
        credits: courseObj?.credits || 0,
        grade: marksData["_grade"] || "N/A",
        total: marksData["Total"] || marksData["_total"] || 0,
        rank: marksData["_rank"] || null,
        section_rank: marksData["_section_rank"] || null,
        is_locked: courseBreakup?.is_locked || false,
        components: components,
        distribution: distributions[courseId] || [],
        cohortSize: allCourseMarks?.filter(am => am.course_id === courseId).length || 0,
        hasPending: components.some(c => c.status !== 'SCORED' || (c.score === 0 && c.weight > 0 && !courseBreakup?.is_locked)),
        stats: {
          avg: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_avg`] ?? courseBreakup?.grade_cutoffs?._meta_avg ?? null,
          max: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_max`] ?? courseBreakup?.grade_cutoffs?._meta_max ?? null,
          median: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_median`] ?? courseBreakup?.grade_cutoffs?._meta_median ?? null,
          min: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_min`] ?? courseBreakup?.grade_cutoffs?._meta_min ?? null,
          cutoffs: courseBreakup?.grade_cutoffs || null
        }
      };
    });

    return NextResponse.json({ 
      scorecards, 
      student: identity,
      trends: snapshots?.map(s => ({
          term: s.courses?.term,
          course: s.courses?.name,
          gpa: s.total_weighted,
          rank: s.rank,
          date: s.snapshot_at
      })) || []
    });
  } catch (err) {
    console.error("Scorecard API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
