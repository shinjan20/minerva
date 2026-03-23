import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

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

    // 1. Fetch Student's Snapshot performance (Aggregates) joined with Course details
    const { data: snapshots } = await supabase
      .from("marks_snapshot")
      .select("*, courses(name)")
      .eq("student_id", session.id);

    // 2. Fetch all raw marks for this student
    const rawId = identity?.student_id || "";
    const pgpid = rawId.includes('@') ? rawId.split('@')[0].toUpperCase() : rawId.toUpperCase();
    const { data: rawMarks } = await supabase
      .from("marks")
      .select("*, courses(name)")
      .eq("pgpid", pgpid);

    if ((!snapshots || snapshots.length === 0) && (!rawMarks || rawMarks.length === 0)) {
      return NextResponse.json({ scorecards: [] });
    }

    // 3. Fetch Visibility Configs (which components are allowed to be seen per course)
    const { data: visibilityRules } = await supabase
      .from("marks_visibility")
      .select("*")
      .eq("is_visible", true);

    // 4. Fetch Score Breakups (to know the weights mapping)
    const { data: breakups } = await supabase
      .from("score_breakup")
      .select("*");

    // Process and synthesize
    const courseIds = new Set<string>();
    snapshots?.forEach(s => courseIds.add(s.course_id));
    rawMarks?.forEach(m => courseIds.add(m.course_id));

    const scorecards = Array.from(courseIds).map(courseId => {
      const snap = (snapshots || []).find(s => s.course_id === courseId) || {};
      const studentMarkRow = (rawMarks || []).find(m => m.course_id === courseId) || {};
      const courseName = snap.courses?.name || studentMarkRow.courses?.name || "Unknown Course";
      
      const courseBreakup = breakups?.find(b => b.course_id === courseId);
      const visibleComps = visibilityRules?.filter(v => v.course_id === courseId).map(v => v.component) || [];

      // Map out visible components
      const components: any[] = [];
      
      if (studentMarkRow && studentMarkRow.marks_data) {
          Object.keys(studentMarkRow.marks_data).forEach(compName => {
              if (compName === '_total' || (!visibleComps.includes(compName) && !courseBreakup?.is_locked)) return;
              
              const compLower = compName.toLowerCase();
              if (compLower.includes("total") || compLower.includes("aggregate")) return;
              
              const comp = studentMarkRow.marks_data[compName];
              let weight = 0;
              if (compLower.includes("quiz")) weight = courseBreakup?.quiz_pct || 0;
              else if (compLower.includes("midterm")) weight = courseBreakup?.midterm_pct || 0;
              else if (compLower.includes("project")) weight = courseBreakup?.project_pct || 0;
              else if (compLower.includes("endterm") || compLower.includes("end")) weight = courseBreakup?.endterm_pct || 0;

              components.push({
                name: compName,
                score: comp.score,
                max: comp.max_score,
                weight: weight
              });
          });
      }

      return {
        courseName,
        rank: snap.rank || null,
        section_rank: snap.section_rank || null,
        rank_change: 0,
        grade: snap.grade || "N/A",
        total: snap.total_weighted || studentMarkRow.marks_data?._total || 0,
        components: components,
        stats: {
          avg: courseBreakup?.grade_cutoffs?._meta_avg || null,
          max: courseBreakup?.grade_cutoffs?._meta_max || null,
          median: courseBreakup?.grade_cutoffs?._meta_median || null,
        },
        credits: courseBreakup?.grade_cutoffs?._meta_credits || 1.0
      };
    });

    return NextResponse.json({ scorecards, student: identity });
  } catch (err) {
    console.error("Scorecard API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
