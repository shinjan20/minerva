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

    // 1. Fetch Student's Snapshot performance joined with Course details
    // 4. Build final UI array mapping by unifying marks + stats
    // Note: We no longer need marks_snapshot as we store everything in marks_data
    const scorecards = rawMarks.map(m => {
      const marksData = m.marks_data || {};
      const courseId = m.course_id;
      const courseObj = m.courses;
      const courseBreakup = breakups?.find(b => b.course_id === courseId);
      
      const componentKeys = Object.keys(marksData).filter(k => !k.startsWith("_"));
      const components = componentKeys.map(k => {
          const comp = marksData[k];
          // Determine weight from breakup config if available
          let weight = 0;
          const kLower = k.toLowerCase();
          if (kLower.includes("quiz")) weight = courseBreakup?.quiz_pct || 0;
          else if (kLower.includes("mid")) weight = courseBreakup?.midterm_pct || 0;
          else if (kLower.includes("project") || kLower.includes("viva")) weight = courseBreakup?.project_pct || 0;
          else if (kLower.includes("end")) weight = courseBreakup?.endterm_pct || 0;
          else if (kLower.includes("participation") || kLower === "cp") weight = courseBreakup?.cp_pct || 0;

          return {
              name: k,
              score: typeof comp === 'object' ? comp.score : comp,
              max: typeof comp === 'object' ? comp.max_score : 100,
              weight: weight,
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
        stats: {
          avg: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_avg`] ?? courseBreakup?.grade_cutoffs?._meta_avg ?? null,
          max: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_max`] ?? courseBreakup?.grade_cutoffs?._meta_max ?? null,
          median: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_median`] ?? courseBreakup?.grade_cutoffs?._meta_median ?? null,
          min: courseBreakup?.grade_cutoffs?.[`_meta_${studentSection}_min`] ?? courseBreakup?.grade_cutoffs?._meta_min ?? null,
        }
      };
    });

    return NextResponse.json({ scorecards, student: identity });
  } catch (err) {
    console.error("Scorecard API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
