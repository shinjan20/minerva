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

    // 1. Fetch Student's Snapshot performance joined with Course details
    const { data: snapshots } = await supabase
      .from("marks_snapshot")
      .select("*, courses(name, term, credits)")
      .eq("student_id", session.id);

    // 2. Fetch all raw marks for this student
    const rawId = identity?.student_id || "";
    const pgpid = rawId.includes('@') ? rawId.split('@')[0].toUpperCase() : rawId.toUpperCase();
    const { data: rawMarks } = await supabase
      .from("marks")
      .select("*, courses(name, term, credits)")
      .eq("pgpid", pgpid);

    if ((!snapshots || snapshots.length === 0) && (!rawMarks || rawMarks.length === 0)) {
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

    // Process and synthesize
    const courseIds = new Set<string>();
    snapshots?.forEach(s => courseIds.add(s.course_id));
    rawMarks?.forEach(m => courseIds.add(m.course_id));

      const scorecards = Array.from(courseIds).map(courseId => {
      const snap = (snapshots || []).find(s => s.course_id === courseId) || {};
      const studentMarkRow = (rawMarks || []).find(m => m.course_id === courseId) || {};
      
      const courseObj = snap.courses || studentMarkRow.courses || {};
      const courseName = courseObj.name || "Unknown Course";
      const term = courseObj.term || 1;
      const credits = courseObj.credits || 1.0;
      
      const courseBreakup = breakups?.find(b => b.course_id === courseId);
      const visibleComps = visibilityRules?.filter(v => v.course_id === courseId).map(v => v.component) || [];

      // Map out visible components
      const components: any[] = [];
      let calculatedTotal = 0;
      
      if (studentMarkRow && studentMarkRow.marks_data) {
          Object.keys(studentMarkRow.marks_data).forEach(compName => {
              const compLower = compName.toLowerCase();
              if (compName === '_total' || compLower === 'total' || compLower === 'aggregate' || compLower === 'total marks') return;
              
              const isVisible = true; // Show all uploaded components as per user request
              if (!isVisible) return;
              
              const comp = studentMarkRow.marks_data[compName];
              let weight = 0;
              if (compLower.includes("quiz") || compLower.includes("assignment")) weight = courseBreakup?.quiz_pct || 0;
              else if (compLower.includes("midterm") || compLower.includes("mid term")) weight = courseBreakup?.midterm_pct || 0;
              else if (compLower.includes("project") || compLower.includes("viva") || compLower.includes("group")) weight = courseBreakup?.project_pct || 0;
              else if (compLower.includes("endterm") || compLower.includes("end term") || compLower.includes("end")) weight = courseBreakup?.endterm_pct || 0;

              components.push({
                name: compName,
                score: comp.score,
                max: comp.max_score,
                weight: weight
              });
          });
      }

      // Robust Total Discovery
      let finalTotal = snap.total_weighted;
      if (finalTotal === undefined || finalTotal === null || finalTotal === 0) {
          // Look for any key that looks like a total in the raw marks data
          const marksData = studentMarkRow.marks_data || {};
          const totalKey = Object.keys(marksData).find(k => {
              const l = k.toLowerCase();
              return l === '_total' || l === 'total' || l === 'total marks' || l === 'aggregate';
          });
          
          if (totalKey) {
              const totalVal = marksData[totalKey];
              finalTotal = typeof totalVal === 'object' ? totalVal.score : totalVal;
          } else if (studentMarkRow.total_marks !== undefined) {
              finalTotal = studentMarkRow.total_marks;
          }
      }

      return {
        courseName,
        term,
        credits,
        rank: snap.rank || null,
        section_rank: snap.section_rank || null,
        rank_change: 0,
        grade: snap.grade || "N/A",
        total: finalTotal || 0,
        components: components,
        stats: {
          avg: courseBreakup?.grade_cutoffs?._meta_avg || null,
          max: courseBreakup?.grade_cutoffs?._meta_max || null,
          median: courseBreakup?.grade_cutoffs?._meta_median || null,
        }
      };
    });

    return NextResponse.json({ scorecards, student: identity });
  } catch (err) {
    console.error("Scorecard API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
